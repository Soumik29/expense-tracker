import express, {type Express} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "@routes/auth.routes.js";
import appConfig from "@config/app.config.js";
import userRoutes from "@routes/user.routes.js";
// FIX 1: Import the Router, not the Controller
import expenseRoutes from "@routes/expense.routes.js"; 

class App{
    private app: Express;
    constructor(){
        this.app = express()
        this.initMiddlewares()
        this.initRoutes()
    }

    private initMiddlewares(){
        this.app.use(express.json());
        this.app.use(cookieParser());
        this.app.use(cors({
            origin: [
                'http://localhost:5173'
            ],
            methods: ['GET', 'POST', 'DELETE', 'PUT'],
            credentials: true
        }));
    }

    private initRoutes(){
        this.app.use("/api/auth", authRoutes);
        this.app.use("/api/user", userRoutes);
        
        // FIX 2: Register the router at the correct PLURAL path
        this.app.use("/api/expenses", expenseRoutes); 
    }

    public start(){
        let {port, host} = appConfig;
        if(host !== undefined){
            host = host
        }else{
            host = "localhost"
        }
        this.app.listen(port, host, () => {
            console.log(`Server is running on http://${host}:${port}`);
        })
    }
}

export default App;