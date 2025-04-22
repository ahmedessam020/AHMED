"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Message from "@/components/adminComponents/Message";
import styles from "./Main_admin.module.css";
import NumberComponent from "./Number";
export default function MainAdmin() {   
    const router = useRouter();
    const [Messages, setMessages] = useState<{ msg: string; id: string }[]>([]);

    useEffect(() => {
        if (localStorage.getItem("token") === null) {
            router.push("/login");
        } else {
            const data = {
                token: localStorage.getItem("token"),
            };
            fetch("/api/get_message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
                .then((response) => {
                    if (!response.ok) {
                        if (response.status === 401) {
                            response.json().then(() => {
                                localStorage.clear();
                                router.push("/login");
                            });
                        } else {
                            response.json().then((res) => {
                                alert(res.message);
                            });
                        }
                    }
                    return response.json(); // Parse JSON response
                })
                .then((result) => {
                    const messages = result.messages.map((message: { msg: string; id: string }) => ({
                        msg: message.msg,
                        id: message.id,
                    }));
                    setMessages(messages);
                })
                .catch((error) => {
                    console.log(error.message);
                });
        }
    }, []);
    return (
    
        <div className={styles.MSG}>
            <NumberComponent />
            {Messages.map((message, index) => (
                <Message key={index} message={message.msg} id={message.id} setMesages={setMessages} />
            ))}
        </div>
    
    );
}