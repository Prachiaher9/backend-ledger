"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRegisterController = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 *
 * - user register controller
 * - POST /api/auth/register
 */
const userRegisterController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name } = req.body;
        const isExists = yield user_model_1.default.findOne({
            email: email,
        });
        if (isExists) {
            return res.status(422).json({
                message: "User already exists with email",
                status: "failed",
            });
        }
        const user = yield user_model_1.default.create({
            email,
            password,
            name,
        });
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "3d",
        });
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 3 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
            },
            token,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating user",
        });
    }
});
exports.userRegisterController = userRegisterController;
