<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_league_entries', function (Blueprint $table) {
            $table->id();
            $table->string('puuid', 78);
            $table->string('region', 16);
            $table->string('queueType', 32);
            $table->string('tier', 16);
            $table->integer('leaguePoints')->default(0);
            $table->integer('wins')->default(0);
            $table->integer('losses')->default(0);
            $table->timestamp('lastSyncedAt')->nullable();
            $table->timestamps();

            $table->unique(['puuid', 'region', 'queueType']);
            $table->index(['region', 'queueType']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_league_entries');
    }
};
