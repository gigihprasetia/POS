import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useState, useEffect } from 'react';
import { Settings, ChevronLeft, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SettingStock() {
    const navigate = useNavigate();
    const config = useLiveQuery(() => db.minStockAlert.toCollection().first());

    const [minStock, setMinStock] = useState('5');

    useEffect(() => {
        if (config) {
            setMinStock(config.stockNumber.toString());
        }
    }, [config]);

    const handleSave = async () => {
        const num = parseInt(minStock, 10);
        if (isNaN(num) || num < 0) {
            toast.error('Masukkan angka yang valid');
            return;
        }

        try {
            if (config?.id) {
                await db.minStockAlert.update(config.id, {
                    stockNumber: num,
                    updatedAt: new Date()
                });
            } else {
                await db.minStockAlert.add({
                    stockNumber: num,
                    updatedAt: new Date(),
                    syncedAt: null
                });
            }
            toast.success('Pengaturan stok minimum berhasil disimpan');
            navigate('/settings');
        } catch (error) {
            console.error(error);
            toast.error('Gagal menyimpan pengaturan');
        }
    };

    return (
        <div className="px-4 pt-6 pb-20 space-y-6 max-w-lg mx-auto">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link to="/settings">
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Pengaturan Stok Minimum
                </h1>
            </div>

            <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="min-stock">Batas Peringatan Stok Minimum</Label>
                        <Input
                            id="min-stock"
                            type="number"
                            min="0"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            placeholder="5"
                        />
                        <p className="text-xs text-muted-foreground">
                            Produk akan muncul dalam daftar peringatan stok rendah jika stok tersisa kurang dari atau sama dengan batas ini.
                        </p>
                    </div>

                    <Button onClick={handleSave} className="w-full gap-2">
                        <Save className="w-4 h-4" />
                        Simpan Pengaturan
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}