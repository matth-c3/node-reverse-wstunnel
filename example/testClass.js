'use strict'
class myClass{
    constructor(numero, nome){
        this.number = numero;
        this.name = nome;
    }
    
    print(){
        console.log('La classe: '+ this.name+' ha il numero: '+this.number);
    }
}

let pippo = new myClass(10,'Andrea');
pippo.print();