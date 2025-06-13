<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    /** @use HasFactory<\Database\Factories\RoomFactory> */
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'capacity',
        'default_owner_department_id',
    ];

    public function defaultOwnerDepartment()
    {
        return $this->belongsTo(Department::class, 'default_owner_department_id');
    }
}
