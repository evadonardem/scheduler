<?php

use App\Models\AcademicYearSchedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subject_classes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignIdFor(AcademicYearSchedule::class)
                ->constrained()
                ->onDelete('cascade')
                ->onUpdate('cascade');
            $table->foreignIdFor(Subject::class)
                ->constrained()
                ->onDelete('cascade')
                ->onUpdate('cascade');
            $table->json('schedule')->nullable();
            $table->foreignIdFor(User::class, 'assigned_to_user_id')
                ->nullable()
                ->constrained()
                ->onDelete('cascade')
                ->onUpdate('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subject_classes');
    }
};
