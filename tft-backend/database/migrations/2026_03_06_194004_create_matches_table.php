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
    Schema::create('matches', function (Blueprint $table) {
        $table->string('id')->primary(); 
        $table->bigInteger('game_datetime'); 
        $table->float('game_length');        
        $table->string('game_version');      
        $table->string('tft_game_type');    
        $table->string('tft_set_core_name');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
