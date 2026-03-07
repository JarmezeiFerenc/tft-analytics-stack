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
        Schema::create('match_participants', function (Blueprint $table) {
            $table->id();
            $table->string('match_id'); 
            $table->string('puuid');    
            $table->string('riotIdGameName')->nullable();
            $table->string('riotIdTagline')->nullable();
            $table->integer('placement'); 
            $table->integer('level');     
            $table->integer('last_round'); 
            $table->integer('gold_left');
            $table->float('time_eliminated');
            $table->integer('total_damage_to_players');
            $table->json('augments')->nullable();
            $table->timestamps();

            $table->foreign('match_id')->references('id')->on('matches')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_participants');
    }
};
