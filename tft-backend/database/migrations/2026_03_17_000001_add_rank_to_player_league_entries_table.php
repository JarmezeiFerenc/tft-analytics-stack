<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_league_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('player_league_entries', 'rank')) {
                $table->string('rank', 8)->default('')->after('tier');
            }
        });
    }

    public function down(): void
    {
        Schema::table('player_league_entries', function (Blueprint $table) {
            if (Schema::hasColumn('player_league_entries', 'rank')) {
                $table->dropColumn('rank');
            }
        });
    }
};