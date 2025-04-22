import  { useEffect, useState } from "react";
import styles from "./Number.module.css";
export default function NumberComponent() {
    const [num, setNum] = useState<string>(process.env.NUM|| "0");
    useEffect(() => {
        fetch("/api/get_num")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {
                setNum(data.num);
            })
            .catch((error) => {
                console.error("Error fetching number:", error);
            });
    }, []);
    
    return (
        <div className={styles.NumberComponent}>
           <p>Current Number: {num}</p>
        </div>
    );
}