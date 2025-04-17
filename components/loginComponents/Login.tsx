import { useRouter } from 'next/navigation'
import styles from "./Login.module.css";
import { useRef } from 'react';
function Login(){
    const router = useRouter();
    const UserInp=useRef<HTMLInputElement>(null)
    const PassInp=useRef<HTMLInputElement>(null)
    const Return=()=>{
        router.push("/");
    }
    const login= ()=>{
        const data={
            user_name:UserInp.current?.value,
            password:PassInp.current?.value
        }
        fetch("/api/genToken",{
            method:"POST",
            headers:{
                'Content-Type': 'application/json'
                        },
            body:JSON.stringify(data)
        })       
         .then(response => {
            if (!response.ok) {
                response.json().then(result=>{
                    alert(result.message);
                })
                throw new Error(`HTTP error! status: ${ response.status}`);
            }
            return response.json(); // Parse JSON response
        })
        .then(result => {
            localStorage.setItem("token",result.token)
            router.push("/admin");
        })
        .catch(error => {
            console.log(error.message)
        });
    }
    return (
        <>
            <div className={styles.loginBox}>
                <input ref={UserInp} type="text" className={styles.INP} placeholder="username" />
                <input ref={PassInp} type="password" className={styles.INP} placeholder="password" />
                <button onClick={Return} className={styles.BUTTON}>cancel</button>
                <button onClick={login} className={styles.BUTTON}>login</button>
            </div>
        </>
    )
}
export default Login;