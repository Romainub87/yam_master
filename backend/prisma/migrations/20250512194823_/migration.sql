-- AlterTable
ALTER TABLE "users" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "game" (
    "id" SERIAL NOT NULL,
    "grid_state" JSONB NOT NULL,
    "dice_state" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "timer" INTEGER NOT NULL,
    "isRanked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_score" (
    "game_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "turn" BOOLEAN NOT NULL,
    "challenge" BOOLEAN NOT NULL DEFAULT false,
    "rolls_left" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_score_pkey" PRIMARY KEY ("game_id","user_id")
);

-- AddForeignKey
ALTER TABLE "player_score" ADD CONSTRAINT "player_score_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_score" ADD CONSTRAINT "player_score_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
