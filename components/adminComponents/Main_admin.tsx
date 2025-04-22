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
        const token = localStorage.getItem("token");

        if (!token) {
            console.error("No token found in localStorage. Redirecting to login.");
            router.push("/login");
            return;
        }
        fetch("/api/get_message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
        })
        .then(response => {
            if (!response.ok) {
                localStorage.clear();
                router.push("/login");
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "Success") {
                setMessages(data.messages);
            } else {
                console.error("Failed to fetch messages:", data.message);
            }
        })
        .catch(err => {
            console.error("Error fetching messages:", err);
        });


        // Connect to the SSE endpoint with the token
        const eventSource = new EventSource(`/api/see_message?token=${encodeURIComponent(token)}`);

        // Listen for messages from the server
        eventSource.onmessage = (event) => {
            try {
                const newMessage = JSON.parse(event.data);
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            } catch (err) {
                console.error("Error parsing message:", err);
            }
        };

        // Handle errors
        eventSource.onerror = async (error) => {
            console.error("SSE error:", error);
            // Attempt to fetch the status code using a fallback fetch request
            try {
                const response = await fetch(`/api/see_message?token=${encodeURIComponent(token)}`);
                if (!response.ok) {
                    console.error(`HTTP Error: ${response.status} - ${response.statusText}`);
                    
                    if (response.status === 401) {
                        alert("Session expired. Please log in again.");
                        localStorage.clear();
                        router.push("/login");
                    } else {
                        alert(`Error: ${response.statusText}`);
                    }
                }
            } catch (fetchError) {
                alert("Network error. Please try again later.");
                console.error("Error fetching status:", fetchError);
            }

            eventSource.close();
        };

        // Cleanup on component unmount
        return () => {
            eventSource.close();
        };
    }, [router]);

    return (
        <div className={styles.MSG}>
            <NumberComponent />
            {Messages.map((message, index) => (
                <Message key={index} message={message.msg} id={message.id} setMesages={setMessages} />
            ))}
        </div>
    );
}