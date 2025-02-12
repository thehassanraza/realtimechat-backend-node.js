//usercontroller
const User = require('../models/usermodel');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

//register user
exports.register = async (req, res) => {
    const { username, password, email, age, gender } = req.body;
    // try {    
        //check if user already exist 
        const existingUsername = await User.findOne({ username });
        const existingEmail = await User.findOne({ email });        
        if (existingUsername) {
            return res.status(400).json({ message: 'User name already exists' });
        }
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ 
            username, 
            password: hashedPassword, 
            email, 
            age, 
            gender,
         });
        const registeredUser = await user.save();
        res.status(201).json({ message: 'User registered successfully', user: registeredUser });
    // } 
    // catch (error) {
    //     res.status(500).json({ message: 'Error registering user', error });
    // }
};


//loging in user and generating authentication token
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        // console.log(username);
        // console.log(password);        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'invalid username' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in user', error });
    }
}

//get user info
// Add to usercontroller.js
exports.getUser = async (req, res) => {
    try {
      const user = await User.findById(req.user.userId)
        .select('-password -__v');
        
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error });
    }
  };


  //searchuser by username
  exports.searchUser = async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, });
        }
        res.status(200).json({
            success: true,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error searching user', error });
    }
};
