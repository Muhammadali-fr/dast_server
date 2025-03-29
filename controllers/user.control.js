const User = require("../models/user.model");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uploadToS3 } = require("../services/s3Service");

const cyfer = bcryptjs.genSaltSync(8);
const jwtSecret = process.env.JWT_SECRET;

// mothod: GET
// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users || users.length === 0) {
      return res.status(404).send("We have no users yet...");
    }
    return res.status(200).json(users);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

// mothod: GET
// Get a user by ID
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
};

// mothod: POST
// Register a new user
const addUser = async (req, res) => {
  try {
    const { name, username, email, bio, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: "Enter all required fields" });
    }

    const existingEmail = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });

    if (existingEmail) {
      return res.status(400).json({ message: "Email is already in use" });
    }
    if (existingUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    let avatarUrl = null;
    if (req.file) {
      avatarUrl = await uploadToS3(req.file); // AWS S3 ga yuklash
    }

    const newUser = new User({
      name,
      username,
      email,
      bio,
      password: bcryptjs.hashSync(password, cyfer),
      avatar: avatarUrl,
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.status(201).json({ message: "Account created successfully", token });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error while creating user", error: err.message });
  }
};

// mothod: PUT
// Edit user by ID
const editUser = async (req, res) => {
  try {
    const {
      id,
      name,
      password,
      verificated,
      username,
      avatar,
      bio,
      email,
      check,
      balance,
    } = req.body;

    let avatarUrl = avatar;
    if (req.file) {
      avatarUrl = await uploadToS3(req.file); // Avatarni yangilash
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name,
        password: password ? bcryptjs.hashSync(password, cyfer) : undefined,
        verificated,
        username,
        avatar: avatarUrl,
        bio,
        email,
        check,
        balance,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(updatedUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

// mothod: DELETE
// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).send("User not found...");
    }
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsers, getUser, addUser, editUser, deleteUser };

// transporter

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   host: "smtp.gmail.com",
//   auth: {
//     user: process.env.AUTH_EMAIL,
//     pass: process.env.AUTH_PASSWORD,
//   },
// });

// transporter.verify((error, success) => {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("ready for OTP verifications");
//     console.log(success);
//   }
// });

// One Time Password

// const sendOTPverification = async ({ _id, email }, res) => {
//   try {
//     const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

//     const mailOptions = {
//       from: process.env.AUTH_EMAIL,
//       to: email,
//       subject: "Check your email - Dast",
//       html: `<p>Your code is -- <b>${otp}</b> -- Do not give it anyone including workers of <i>Dast server</i> </p>`,
//     };

//     const saltRounds = 10;

//     const hashedOTP = await bcryptjs.hash(otp, saltRounds);

//     const newOTP = await new OTP({
//       userid: _id,
//       otp: hashedOTP,
//       createdAt: Date.now(),
//       expiresAt: Date.now() + 3600000,
//     });
//     await newOTP.save();

//     transporter.sendMail(mailOptions);

//     res.json({
//       status: "KUTILMOQDA",
//       message: "Verificatsiya code email ga jonatildi",
//       data: {
//         userid: _id,
//         email,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };

// const verifyOTP = async (req, res) => {
//   try {
//     let { userid, otp } = req.body;
//     if (!userid || !otp) {
//       throw new Error("Bo'sh maydonlarga ruxsat berilmaydi");
//     } else {
//       const userOTP = await OTP.find({ userid });
//       if (userOTP.length <= 0) {
//         throw new Error(
//           "Hisob qaydlari mavjud emas yoki hisob allaqachon tasdiqlangan"
//         );
//       } else {
//         const { expiresAt } = userOTP[0];
//         const hashedOTP = userOTP[0].otp;

//         if (expiresAt < Date.now()) {
//           await OTP.deleteMany({ userid });
//           throw new Error("Kod muddati o'tgan. Iltimos, qayta so'rang");
//         } else {
//           const validOTP = await bcryptjs.compare(otp, hashedOTP); // `await` qo'shildi

//           if (!validOTP) {
//             throw new Error("Noto'g'ri kod, pochta qutingizni tekshiring");
//           } else {
//             await User.updateOne({ _id: userid }, { verificated: true });
//             await OTP.deleteMany({ userid });
//             res.json({
//               status: "TEKSHIRILDI",
//               message: "Sizning emailingiz muvaffaqiyatli tekshirildi",
//             });
//           }
//         }
//       }
//     }
//   } catch (error) {
//     res.json({
//       status: "QABUL QILINMADI",
//       message: error.message,
//     });
//   }
// };

// const resendOTP = async (req, res) => {
//   try {
//     let { userid, email } = req.body;

//     if (!userid || !email) {
//       throw Error("empty fileds are not allowed");
//     } else {
//       await OTP.deleteMany({ userid });
//       sendOTPverification({ _id: userid, email }, res);
//     }
//   } catch (err) {
//     res.json({
//       status: "QABUL QILINMADI",
//       message: err.message,
//     });
//   }
// };

const clearUsers = async (req, res) => {
  console.log("Incoming request:", req.body); // Log the incoming body or query parameters
  try {
    await User.deleteMany();
    res.status(202).send("Barcha userlar o'chirildi");
  } catch (err) {
    console.error(err);
    res.status(500).send("Foydalanuvchilarni o'chirishda xatolik yuz berdi");
  }
};

module.exports = {
  getUser,
  getUsers,
  addUser,
  editUser,
  deleteUser,
  clearUsers,
};

// sendOTPverification,
// verifyOTP,
// resendOTP,
