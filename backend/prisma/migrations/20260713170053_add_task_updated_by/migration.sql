-- AlterTable
ALTER TABLE "task" ADD COLUMN     "updatedById" TEXT;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
