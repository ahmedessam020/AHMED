import styles from "./Message.module.css";
type MessageProps = {
    message: string;
    id:string;
    setMesages:React.Dispatch<React.SetStateAction<{msg:string,id:string}[]>>;
}
function del_message(id:string,setMesages:React.Dispatch<React.SetStateAction<{msg:string,id:string}[]>>) { 
    const data = {
        token: localStorage.getItem("token"),
        id: id
    };
    fetch("/api/del_message", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        setMesages(prevMessages => prevMessages.filter(message => message.id !== id));
        if (!response.ok) {
            console.log(`Error deleting message: ${response.status}`);
        }else{
            const elementBlur = document.querySelector(`.${styles.blur}`);
            console.log(elementBlur);
            if (elementBlur) {
                console.log("removendo blur");
                document.body.removeChild(elementBlur);
            } else {
                console.log("blur removido");
            }
        }
    })
    .catch(error => {
        console.log(error.message);
    });
};

export default function Message({ message,id,setMesages }: MessageProps) {
    return (
        <div onClick={(e) => {
            if (document.querySelector(`.${styles.active}`) ) {
                const blurElement = document.querySelector(`.${styles.blur}`);
                if (blurElement) {
                    document.body.removeChild(blurElement);
                }
            }

            e.currentTarget.classList.toggle(styles.active)
            
            const elementBlur=document.createElement("div")
            elementBlur.classList.add(styles.blur)
            elementBlur.onclick=()=>{
                const element=document.querySelector(`.${styles.active}`)
                if (element) {
                    element.classList.toggle(styles.active)
                }
                document.body.removeChild(elementBlur)
            }
            if (document.querySelector(`.${styles.active}`) ) {
                document.body.appendChild(elementBlur)
            }else{

                console.log("No active message to blur")
            }
        }} className={`${styles.messageContainer}`}>
            
            <p className={styles.messageText}>{message}</p>
            <button className={styles.DeleteButton} onClick={() => del_message(id, setMesages)}>X</button>
        </div>
    );
}