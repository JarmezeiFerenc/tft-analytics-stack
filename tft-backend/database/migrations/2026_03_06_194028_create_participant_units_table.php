<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('participant_units', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('participant_id'); 
            $table->string('character_id');
            $table->integer('tier');
            $table->integer('rarity');
            
            $table->string('item_1')->nullable(); 
            $table->string('item_2')->nullable();
            $table->string('item_3')->nullable();
            
            $table->timestamps();

            $table->foreign('participant_id')->references('id')->on('match_participants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('participant_units');
    }
};
