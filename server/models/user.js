import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type: String,
        required: true,
        unique:true,
        trim:true
    },
    password:{
        type: String,
        required:true,
    },
    stack:[
        {
            type: String ,
            lowercase:true,
            trim:true
        }
    ],
    experienceLevel:{
        type: String,
        enum:["beginner","intermediate","advanced"],
        default:"beginner"
    },
     bookmarks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Issue",
            },
        ],
        contributions:[
            {
                repoName: String,
                issueTitle: String,
                pullRequestUrl: String,
                status: {
                    type: String,
                    enum: ["planned", "submitted", "merged"],
                },
            },
        ],
    },
        {
            timestamps:true
        }
);
const User = mongoose.model("User",userSchema);
export default User;
