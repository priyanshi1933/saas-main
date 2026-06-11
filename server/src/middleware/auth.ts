import { Request,Response,NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") }); 

const secret=process.env.JWT_SECRET as string;

export const verifyToken=(req:Request,res:Response,next:NextFunction)=>{
    const authHeader=req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({message:"Not authorized"});
    }
    const token=authHeader.split(" ")[1];
    try{
        const decoded:any=jwt.verify(token,secret);
        (req as any).user=decoded;
        next();
    }catch{
        return res.status(401).json({message:"Invalid token"});
    }
}

export const authorize = (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};


