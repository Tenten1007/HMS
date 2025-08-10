import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Building2, Users, Banknote, Zap, Droplets, AlertCircle, RefreshCw } from 'lucide-react';
import { useRoomData } from '../hooks/useRoomData';
import React from 'react';

// Inline Loading Component
const LoadingCard = ({ text = "กำลังโหลดข้อมูล..." }) => (
  <div className="flex items-center justify-center min-h-[200px] rounded-lg border bg-card p-8">
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 h-8 w-8" />
      <p className="text-sm text-gray-500 animate-pulse">{text}</p>
    </div>
  </div>
);

// Inline Error Component
const ErrorDisplay = ({ error, onRetry }) => {
  const errorMessage = typeof error === 'string' ? error : error?.message || "ไม่สามารถโหลดข้อมูลได้";
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center space-y-4 text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="font-semibold text-red-600">เกิดข้อผิดพลาด</h3>
        <p className="text-gray-600 max-w-md">{errorMessage}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            ลองใหม่
          </button>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { rooms, bills, getOccupiedRooms, loading, error, refetch } = useRoomData();

  // รายได้รวม (เฉพาะบิลที่จ่ายแล้ว)
  const totalRevenue = bills
    .filter(bill => bill.status === 'paid')
    .reduce((sum, bill) => sum + (bill.total || 0), 0);

  const occupiedRooms = getOccupiedRooms();
  const occupancyRate = rooms.length > 0 ? (occupiedRooms / rooms.length) * 100 : 0;

  if (loading) {
    return <LoadingCard text="กำลังโหลดข้อมูล Dashboard..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay 
          error={error}
          title="ไม่สามารถโหลดข้อมูล Dashboard ได้"
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pl-6 pr-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จำนวนห้องทั้งหมด</CardTitle>
            <Building2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length} ห้อง</div>
            <p className="text-xs text-blue-100">ห้องที่ให้เช่า</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ห้องที่มีผู้เช่า</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupiedRooms} ห้อง</div>
            <p className="text-xs text-green-100">ห้องที่มีผู้เช่า {occupancyRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ห้องว่าง</CardTitle>
            <Building2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.length - occupiedRooms} ห้อง</div>
            <p className="text-xs text-orange-100">พร้อมให้เช่า</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายได้รวม</CardTitle>
            <Banknote className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-purple-100">เดือนนี้ (เฉพาะบิลที่จ่ายแล้ว)</p>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              สถานะห้องพัก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="font-semibold text-blue-600">{room.number}</span>
                    </div>
                    <div>
                      <p className="font-medium">{room.tenant || 'ห้องว่าง'}</p>
                      <p className="text-sm text-gray-500">฿{room.rent ? room.rent.toLocaleString() : 0}/เดือน</p>
                    </div>
                  </div>
                  <Badge variant={room.tenant ? "default" : "secondary"}>
                    {room.tenant ? 'มีผู้เช่า' : 'ว่าง'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              สรุปค่าสาธารณูปโภค
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rooms.filter(room => room.tenant).map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="font-semibold text-green-600">{room.number}</span>
                    </div>
                    <div>
                      <p className="font-medium">{room.tenant}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {room.electricUnits} หน่วย
                        </span>
                        <span className="flex items-center gap-1">
                          <Droplets className="h-3 w-3" />
                          {room.waterUnits} หน่วย
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">฿{room.totalUtilityCost.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">ค่าน้ำค่าไฟ</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 