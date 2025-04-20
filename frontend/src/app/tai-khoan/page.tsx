'use client';
import { useAuth } from "@/contexts/AuthContext";

export default function AccountPage() {
    const { user } = useAuth();
    if (!user) {
        return <div>Vui lòng đăng nhập để truy cập trang tài khoản.</div>;
    }
    return (
        <div className="container mx-auto p-4">
            <h1>Tài khoản</h1>
            <div>
                <h2>Thông tin tài khoản</h2>
                <p>Tên tài khoản: {user.full_name}</p>
                <p>Email: {user.email}</p>
            </div>
        </div>
    );
}