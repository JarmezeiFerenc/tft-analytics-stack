<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('participant_units', function (Blueprint $table) {
            $table->index(
                ['character_id', 'participant_id'], 
                'pu_unit_stats_simple_idx'
            );
        });

        Schema::table('match_participants', function (Blueprint $table) {
            $table->index(
                ['id', 'placement'],
                'mp_id_placement_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('participant_units', function (Blueprint $table) {
            $table->dropIndex('pu_unit_stats_covering_idx');
        });

        Schema::table('match_participants', function (Blueprint $table) {
            $table->dropIndex('mp_id_placement_idx');
        });
    }
};
