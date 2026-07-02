const User = require("../models/user");
const { generateToken } = require("../services/jwtService");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ msg: "ID Token is required" });
  }

  try {
    // 1. Verify the Google ID Token securely
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    // 2. Look up the user by their unique Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // 3. Fallback: Match existing email to auto-link old accounts (if wiping dev database isn't complete)
      user = await User.findOne({ email });
      
      if (user) {
        user.googleId = googleId;
        // Optionally store profile data if missing from the old account record
        if (!user.name) user.name = name;
        if (!user.avatar) user.avatar = avatar;
        await user.save();
      } else {
        // 4. Create a brand new user document
        user = await User.create({
          googleId,
          email,
          name,
          avatar,
        });
      }
    }

    // 5. Issue your existing JWT using your service (passing user._id matching your prior code)
    const token = generateToken(user._id);
    
    return res.json({ token });
  } catch (err) {
    console.error("Google Auth Error:", err.message);
    return res.status(401).json({ msg: "Invalid or expired Google token" });
  }
};

module.exports = { googleLogin };