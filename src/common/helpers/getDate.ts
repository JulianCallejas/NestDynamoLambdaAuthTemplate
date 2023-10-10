
export class GetDate {
    

    static getFullDate(): string{
        let date = new Date();
        
        return `${date.
            toLocaleDateString('es-CO',{year:'numeric', month:'2-digit', day:'2-digit'})
            .split("/") 
            .reverse()  
            .join("-")} ${date.
            toLocaleTimeString('es-CO',{hour: '2-digit', 
            minute:'2-digit',
            second:'2-digit',
            hour12:false})}`
    }

    static getDate(): string{
        let date = new Date();
        return date.
        toLocaleDateString('es-CO',{year:'numeric', month:'2-digit', day:'2-digit'})
        .split("/") 
        .reverse()  
        .join("-");
    }
    
}