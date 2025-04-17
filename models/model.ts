import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Message interface
interface IMessage extends Document {
    message: string;
    _id: string;
}

// Define the User interface
interface IUser extends Document {
    user_name: string;
    password: string;
    token: string;
}

// Define the Message schema
const MessageSchema: Schema = new Schema({
    message: {
        type: String,
        required: true,
    },
});

// Define the User schema
const UserSchema: Schema = new Schema({
    user_name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
});

// Create the models
const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export {
    Message,
    User
};
export type {
        IMessage,
        IUser};
