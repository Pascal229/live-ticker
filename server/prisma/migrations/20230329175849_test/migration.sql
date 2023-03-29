-- CreateEnum
CREATE TYPE "Status" AS ENUM ('NOT_STARTED', 'FIRST_PERIOD', 'SECOND_PERIOD', 'PAUSED', 'BREAK', 'FINISHED');

-- CreateEnum
CREATE TYPE "GameEventType" AS ENUM ('GOAL', 'PENALTY', 'PENALTY_KICK', 'BREAK', 'PAUSE', 'FIRST_PERIOD', 'SECOND_PERIOD', 'FINISH');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "guestTeam" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "guestScore" INTEGER NOT NULL,
    "homeTeamKey" TEXT NOT NULL,
    "guestTeamKey" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "type" "GameEventType" NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "teamIndex" INTEGER,
    "scorerPlayerId" INTEGER,
    "assistingPlayerId" INTEGER,
    "gameId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameId" INTEGER,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GameToPlayer" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GameToPlayer_AB_unique" ON "_GameToPlayer"("A", "B");

-- CreateIndex
CREATE INDEX "_GameToPlayer_B_index" ON "_GameToPlayer"("B");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_scorerPlayerId_fkey" FOREIGN KEY ("scorerPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_assistingPlayerId_fkey" FOREIGN KEY ("assistingPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToPlayer" ADD CONSTRAINT "_GameToPlayer_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToPlayer" ADD CONSTRAINT "_GameToPlayer_B_fkey" FOREIGN KEY ("B") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
