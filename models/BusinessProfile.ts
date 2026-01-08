import mongoose from 'mongoose';

const BusinessProfileSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  logoUrl: String,
  styles: {
    primaryColor: String,
    typography: String,
    borderRadius: String,
    padding: String,
  },
  webhookSecret: String,
  socialMedia: {
    twitter: {
      apiKey: String,
      apiSecret: String,
      accessToken: String,
      accessSecret: String,
    },
    linkedin: {
      clientId: String,
      clientSecret: String,
      accessToken: String,
    },
    facebook: {
      accessToken: String,
      pageId: String,
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// If we want to ensure only one profile exists for this simple app, we can just use findOne
export default mongoose.models.BusinessProfile || mongoose.model('BusinessProfile', BusinessProfileSchema);
