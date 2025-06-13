<?php

use App\Models\AcademicYearSchedule;
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
            $table->foreignId('curriculum_subject_id')
                ->constrained(
                    table: 'curriculum_subject'
                )
                ->onDelete('cascade')
                ->onUpdate('cascade');
            $table->float('credit_hours');
            $table->unsignedTinyInteger('section');
            $table->unsignedTinyInteger('capacity')->default(0);
            $table->boolean('is_block')->default(false);
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
