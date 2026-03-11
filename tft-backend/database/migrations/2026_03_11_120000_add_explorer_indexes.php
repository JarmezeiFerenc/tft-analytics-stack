<?php

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
        Schema::table('participant_traits', function (Blueprint $table) {
            $table->index(['participant_id', 'name'], 'pt_participant_name_idx');
            $table->index(['name', 'tier_current', 'participant_id'], 'pt_name_tier_participant_idx');
        });

        Schema::table('participant_units', function (Blueprint $table) {
            $table->index(['participant_id', 'character_id'], 'pu_participant_character_idx');
            $table->index(['character_id', 'participant_id'], 'pu_character_participant_idx');
            $table->index(['character_id', 'item_1'], 'pu_character_item1_idx');
            $table->index(['character_id', 'item_2'], 'pu_character_item2_idx');
            $table->index(['character_id', 'item_3'], 'pu_character_item3_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('participant_units', function (Blueprint $table) {
            $table->dropIndex('pu_participant_character_idx');
            $table->dropIndex('pu_character_participant_idx');
            $table->dropIndex('pu_character_item1_idx');
            $table->dropIndex('pu_character_item2_idx');
            $table->dropIndex('pu_character_item3_idx');
        });

        Schema::table('participant_traits', function (Blueprint $table) {
            $table->dropIndex('pt_participant_name_idx');
            $table->dropIndex('pt_name_tier_participant_idx');
        });
    }
};
