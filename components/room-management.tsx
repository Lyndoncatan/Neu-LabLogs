'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';

interface Room {
  id: string;
  number: string;
  name: string;
  capacity: number;
  equipment: string[];
  qrCode: string;
}

interface RoomManagementProps {
  onUpdate: (rooms: Room[]) => void;
}

export function RoomManagement({ onUpdate }: RoomManagementProps) {
  const [rooms, setRooms] = useState<Room[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('labRooms');
      return stored
        ? JSON.parse(stored)
        : [
            {
              id: 'room-101',
              number: '101',
              name: 'Advanced Chemistry Lab',
              capacity: 30,
              equipment: ['Fume hood', 'Analyzer'],
              qrCode: 'room-101',
            },
            {
              id: 'room-102',
              number: '102',
              name: 'Physics Lab',
              capacity: 25,
              equipment: ['Oscilloscope', 'Power supply'],
              qrCode: 'room-102',
            },
            {
              id: 'room-103',
              number: '103',
              name: 'Biology Lab',
              capacity: 20,
              equipment: ['Microscope', 'Centrifuge'],
              qrCode: 'room-103',
            },
            {
              id: 'room-104',
              number: '104',
              name: 'Materials Lab',
              capacity: 15,
              equipment: ['SEM', 'Thermal analyzer'],
              qrCode: 'room-104',
            },
          ];
    }
    return [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    capacity: '20',
    equipment: '',
  });

  const saveRooms = (updatedRooms: Room[]) => {
    setRooms(updatedRooms);
    localStorage.setItem('labRooms', JSON.stringify(updatedRooms));
    onUpdate(updatedRooms);
  };

  const handleAddRoom = () => {
    if (!formData.number || !formData.name) return;

    const newRoom: Room = {
      id: `room-${formData.number}`,
      number: formData.number,
      name: formData.name,
      capacity: parseInt(formData.capacity) || 20,
      equipment: formData.equipment.split(',').map((e) => e.trim()).filter(Boolean),
      qrCode: `room-${formData.number}`,
    };

    saveRooms([...rooms, newRoom]);
    resetForm();
  };

  const handleUpdateRoom = (id: string) => {
    if (!formData.number || !formData.name) return;

    const updated = rooms.map((room) =>
      room.id === id
        ? {
            ...room,
            number: formData.number,
            name: formData.name,
            capacity: parseInt(formData.capacity) || 20,
            equipment: formData.equipment.split(',').map((e) => e.trim()).filter(Boolean),
          }
        : room
    );

    saveRooms(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    saveRooms(rooms.filter((room) => room.id !== id));
  };

  const startEdit = (room: Room) => {
    setEditId(room.id);
    setFormData({
      number: room.number,
      name: room.name,
      capacity: room.capacity.toString(),
      equipment: room.equipment.join(', '),
    });
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditId(null);
    setFormData({ number: '', name: '', capacity: '20', equipment: '' });
  };

  return (
    <div className="space-y-4">
      {/* Add Room Form */}
      {(isAdding || editId) && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editId ? 'Edit Room' : 'Add New Room'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number">Room Number</Label>
                <Input
                  id="number"
                  placeholder="e.g., 101"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Advanced Chemistry Lab"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment (comma-separated)</Label>
                <Input
                  id="equipment"
                  placeholder="e.g., Microscope, Centrifuge"
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                />
              </div>

              <Button
                onClick={() => (editId ? handleUpdateRoom(editId) : handleAddRoom())}
                className="md:col-span-2"
              >
                <Check className="h-4 w-4 mr-2" />
                {editId ? 'Update Room' : 'Add Room'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rooms List */}
      <div className="grid gap-4">
        {rooms.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No rooms configured yet</p>
            </CardContent>
          </Card>
        ) : (
          rooms.map((room) => (
            <Card key={room.id} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{room.name}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Room {room.number}
                      </span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        QR: {room.qrCode}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>📍 Capacity: {room.capacity} people</p>
                      {room.equipment.length > 0 && (
                        <p>🔧 Equipment: {room.equipment.join(', ')}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(room)}
                      className="text-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(room.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!isAdding && !editId && (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add New Room
        </Button>
      )}
    </div>
  );
}
