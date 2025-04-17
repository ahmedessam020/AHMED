"use client"
import Login from "@/components/loginComponents/Login"
import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function Lo(){
        const router=useRouter();
        useEffect(()=>{
            if(localStorage.getItem("token")){
                router.push('/admin')
            }
        })
        return (
            <main>
                <Login  />
            </main>
        );

    
}