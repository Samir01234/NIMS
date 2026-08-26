const mongoose = require("mongoose")
const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        mobileNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,   
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        profileImage: {
            type: String,
            default: ""
        },
        role: {
            type: String,
            enum: ["user", "admin"],    
            default: "user"
        }
    },  
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);