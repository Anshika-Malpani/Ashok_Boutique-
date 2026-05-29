import express from "express";
const router = express.Router();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Customer from "../models/Customer.js";

const createToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    "secretkey",
    { expiresIn: "7d" }
  );

const publicUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  phone: user.phone,
  role: user.role,
  customerId: user.customerId,
});

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { fullName, phone, password, role } = req.body;

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      phone,
      password: hashedPassword,
      role,
    });

    const customer = await Customer.findOne({ phone });
    if(customer){
      newUser.customerId = customer._id;
      await newUser.save();
   }


    res.status(201).json({
      message: "Signup successful",
      token: createToken(newUser),
      user: publicUser(newUser),
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
  
      const user = await User.findOne({ phone });
      
      if (!user) {
        return res.status(400).json({
          message: "User not found",
        });
      }
  
      const isMatch = await bcrypt.compare(
        password,
        user.password
      );
  
      if (!isMatch) {
        return res.status(400).json({
          message: "Invalid password",
        });
      }
  
      const customer = await Customer.findOne({ phone });

      if (customer && String(user.customerId || "") !== String(customer._id)) {
        user.customerId = customer._id;
        await user.save();
      }

      const token = createToken(user);
  
      res.json({
        message: "Login successful",
        token,
        user: publicUser(user),
      });
  
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  });

export default router;
