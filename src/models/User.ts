import mongoose, { Schema, Document, Types } from "mongoose";

export enum SocialNetworkTypes {
    FACEBOOK = 'facebook',
    INSTAGRAM = 'instagram',
    YOUTUBE = 'youtube',
    TWITTER = 'twitter',
    THRENDS = 'thrends'
}

export interface ISocialNetwork {
    _id: Types.ObjectId
    type: SocialNetworkTypes | string;
    name: string;
    url: string;
}

export enum ContactsType {
    PHONE = 'phone',
    EMAIL = 'email',
    WHATSAPP = 'whatsapp',
    TELEGRAM = 'telegram',
    LINKEDIN = 'linkedin'
}

export interface IContact {
    _id: Types.ObjectId
    type: ContactsType | string;
    name: string;
}


export interface IUser extends Document {
    email: string,
    password?: string,
    name: string,
    lastname?: string,
    nickname?: string,
    photo?: string,
    birthdate?: Date,
    role: string,
    isVerified: boolean,
    provider: 'local' | 'google' | 'facebook',
    providerId?: string,
    bio?: string,
    country?: string,
    status?: 'active' | 'inactive' | 'suspended',
    socialNetworks?: ISocialNetwork[],
    contacts?: IContact[],
    comments?: Types.ObjectId[]
}

const userSchema: Schema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: function () {
            return this.provider === 'local';
        },
    },
    name: {
        type: String,
        require: true
    },
    nickname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
    },
    birthdate: {
        type: Date,
    },
    photo: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'writer', 'admin'],
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    provider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local',
    },
    providerId: {
        type: String,
    },
    bio: {
        type: String,
        default: '',
    },
    country: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active',
    },
    socialNetworks: {
        type: [{
            type: {
                type: String,
                enum: Object.values(SocialNetworkTypes),
                required: true
            },
            name: { type: String, required: true },
            url: { type: String, required: true }
        }],
        default: []
    },
    contacts: {
        type: [{
            type: {
                type: String,
                enum: Object.values(ContactsType),
                required: true
            },
            name: { type: String, required: true }
        }],
        default: []
    },
    comments: {
        type: [Types.ObjectId],
        ref: 'Comment',
        default: []
    }
}, { timestamps: true })

const User = mongoose.model<IUser>('User', userSchema)
export default User