import { PrismaClient, User, Video, VideoEngagement, FollowEngagement, Announcement, AnnouncementEngagement, Comment, Playlist, PlaylistHasVideo } from "@prisma/client";
import { ObjectId } from 'mongodb';
import fs from "fs";
import path from "path";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Helper function to read JSON data from files
function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

// Load data from JSON files
const users = readJsonFile<User[]>(path.join(__dirname, "data/user.json"));
const videos = readJsonFile<Video[]>(path.join(__dirname, "data/video.json"));
const videoEngagements = readJsonFile<VideoEngagement[]>(path.join(__dirname, "data/videoEngagement.json"));
const followEngagements = readJsonFile<FollowEngagement[]>(path.join(__dirname, "data/followEngagement.json"));
const announcements = readJsonFile<Announcement[]>(path.join(__dirname, "data/announcement.json"));
const announcementEngagements = readJsonFile<AnnouncementEngagement[]>(path.join(__dirname, "data/announcementEngagement.json"));
const comments = readJsonFile<Comment[]>(path.join(__dirname, "data/comment.json"));
const playlists = readJsonFile<Playlist[]>(path.join(__dirname, "data/playlist.json"));
const playlistHasVideos = readJsonFile<PlaylistHasVideo[]>(path.join(__dirname, "data/playlistHasVideo.json"));

// Helper function to process data in chunks
async function processInChunks<T>(items: T[], chunkSize: number, processItem: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(processItem));
  }
}

// Main function to seed data
async function main() {
  // Delete existing records
  await prisma.user.deleteMany();
  await prisma.video.deleteMany();
  await prisma.videoEngagement.deleteMany();
  await prisma.followEngagement.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.announcementEngagement.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.playlistHasVideo.deleteMany();

  // Upsert data
  await processInChunks(users, 1, async (user) => {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
        image: user.image ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}${user.image}` : null,
        backgroundImage: user.backgroundImage ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}${user.backgroundImage}` : null,
        handle: user.handle,
        description: user.description,
      },
      create: {
        id: new ObjectId(user.id).toHexString(),
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
        image: user.image ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}${user.image}` : null,
        backgroundImage: user.backgroundImage ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}${user.backgroundImage}` : null,
        handle: user.handle,
        description: user.description,
      },
    });
  });

  await processInChunks(videos, 1, async (video) => {
    await prisma.video.upsert({
      where: { id: video.id },
      update: {
        title: video.title,
        thumbnailUrl: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}${video.thumbnailUrl}`,
        videoUrl: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}${video.videoUrl}`,
        userId: video.userId,
        createdAt: new Date(video.createdAt),
        updatedAt: new Date(video.updatedAt),
      },
      create: {
        ...video,
        thumbnailUrl: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}${video.thumbnailUrl}`,
        videoUrl: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME}${video.videoUrl}`,
        createdAt: new Date(video.createdAt),
        updatedAt: new Date(video.updatedAt),
      },
    });
  });

  await processInChunks(videoEngagements, 1, async (videoEngagement) => {
    await prisma.videoEngagement.create({ data: videoEngagement });
  });

  await processInChunks(followEngagements, 1, async (followEngagement) => {
    const existingFollowEngagements = await prisma.followEngagement.findMany({
      where: {
        followerId: followEngagement.followerId,
        followingId: followEngagement.followingId,
      },
    });
    if (existingFollowEngagements.length === 0) {
      await prisma.followEngagement.create({ data: followEngagement });
    }
  });

  await processInChunks(announcements, 1, async (announcement) => {
    await prisma.announcement.create({ data: announcement });
  });

  await processInChunks(announcementEngagements, 1, async (announcementEngagement) => {
    const existingAnnouncementEngagements = await prisma.announcementEngagement.findMany({
      where: {
        announcementId: announcementEngagement.announcementId,
        userId: announcementEngagement.userId,
      },
    });
    if (existingAnnouncementEngagements.length === 0) {
      await prisma.announcementEngagement.create({ data: announcementEngagement });
    }
  });

  await processInChunks(comments, 1, async (comment) => {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {
        message: comment.message,
        videoId: comment.videoId,
        userId: comment.userId,
        createdAt: new Date(comment.createdAt),
        updatedAt: new Date(comment.updatedAt),
      },
      create: {
        id: comment.id,
        message: comment.message,
        videoId: comment.videoId,
        userId: comment.userId,
        createdAt: new Date(comment.createdAt),
        updatedAt: new Date(comment.updatedAt),
      },
    });
  });

  await processInChunks(playlists, 1, async (playlist) => {
    await prisma.playlist.upsert({
      where: { id: playlist.id },
      update: {
        title: playlist.title,
        description: playlist.description,
        userId: playlist.userId,
        createdAt: new Date(playlist.createdAt),
        updatedAt: new Date(playlist.updatedAt),
      },
      create: {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        userId: playlist.userId,
        createdAt: new Date(playlist.createdAt),
        updatedAt: new Date(playlist.updatedAt),
      },
    });
  });

  await processInChunks(playlistHasVideos, 1, async (playlistHasVideo) => {
    await prisma.playlistHasVideo.create({ data: playlistHasVideo });
  });
}

// Execute the main function
main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
