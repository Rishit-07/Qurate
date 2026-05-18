import mongoose from "mongoose";

const fitScoreSchema = new mongoose.Schema(
    {
        useIdr: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        score:  {
            type: Number,
            default: 0,
            min:1,
            max:10
        },
        reason:{
            type:String
        },
        tags : [
            {
                type:String
            }
        ],
        scoredAt : {
            type:Date, 
            default:Date.now
        }
    },
    { _id: false }
);

export default fitScoreSchema;
