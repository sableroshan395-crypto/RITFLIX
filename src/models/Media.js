import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    type: {
      type: String,
      enum: ["Movie", "Series", "Anime"],
      required: [true, "Please provide the media type"],
    },
    genre: {
      type: String,
      required: [true, "Please provide a genre"],
    },
    duration: {
      type: String,
      default: "", // Optional duration
    },
    thumbnailUrl: {
      type: String,
      required: [true, "Please provide a thumbnail URL"],
    },
    bannerUrl: {
      type: String,
      required: [true, "Please provide a banner URL"],
    },
    videoSource: {
      type: String,
      required: [
        function() { return this.type === 'Movie'; },
        "Please provide a video source URL for the movie"
      ],
    },
    audioTracks: [{
      label: { type: String, required: true },
      url: { type: String, required: true }
    }],
    seasons: [{
      seasonNumber: { type: Number, required: true },
      episodes: [{
        episodeNumber: { type: Number, required: true },
        title: { type: String, required: true },
        duration: { type: String, default: "" },
        videoSource: { type: String, required: true },
        audioTracks: [{
          label: { type: String, required: true },
          url: { type: String, required: true }
        }]
      }]
    }],
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent Mongoose from using the cached old schema during hot reloads
if (mongoose.models.Media) {
  delete mongoose.models.Media;
}

export default mongoose.model("Media", MediaSchema);
