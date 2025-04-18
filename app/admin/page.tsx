"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Message from "@/components/adminComponents/Message";
import styles from "./page.module.css";

export default function Admin() {
    const router = useRouter();
    const D = useRef<HTMLDivElement>(null);
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
        <div ref={D} className={styles.MSG}>
            {Messages.map((message, index) => (
                <Message key={index} message={message.msg} id={message.id} setMesages={setMessages} />
            ))}
        </div>
    );
}