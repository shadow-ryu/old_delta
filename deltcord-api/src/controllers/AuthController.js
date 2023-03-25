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
exports.handleRefreshToken = exports.handleSignup = exports.handleLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const cookieGenerator_1 = __importDefault(require("../utils/cookieGenerator"));
const filterReqData_1 = __importDefault(require("../utils/filterReqData"));
const handleLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, username, password } = req.body;
    console.log("first", (!email || !username));
    if ((!email && !username) || !password)
        return res.status(400).
            json({
            success: false,
            message: " All feilds  are required"
        });
    const usergiveType = username && email ? "email" : email ? "email" : "username";
    const filteredBody = (0, filterReqData_1.default)(req.body, "password", usergiveType);
    let foundUser = yield User_1.default.findOne({ [usergiveType]: filteredBody[usergiveType] }).select('+password').exec();
    // if (email)
    // =usergiveType
    if (!foundUser)
        return res.sendStatus(401); //Unauthorized
    // evaluate password
    const isPasswordCorrect = yield (foundUser === null || foundUser === void 0 ? void 0 : foundUser.verifyPassword(filteredBody === null || filteredBody === void 0 ? void 0 : filteredBody.password));
    if (isPasswordCorrect) {
        (0, cookieGenerator_1.default)(foundUser, res, "Login Successful");
    }
    else {
        res.status(401).
            json({
            success: false,
            message: " Unauthorise request"
        });
    }
});
exports.handleLogin = handleLogin;
const handleSignup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, lastName, firstName, username } = req.body;
        if (!email || !password || !lastName || !firstName) {
            res.status(400).
                json({
                success: false,
                message: " All feilds  are required"
            });
        } //finding if user is already register
        const filteredBody = (0, filterReqData_1.default)(req.body, "firstName", "lastName", "email", "password", "username");
        if (!filteredBody["username"]) {
            filteredBody["username"] = filteredBody.email;
        }
        const existingUser = yield User_1.default.findOne({ email: email });
        if (existingUser) {
            res.status(403).json({
                success: false,
                message: `${existingUser.email} is already been registered`
            });
        }
        //creating user in mongo db
        const user = new User_1.default(filteredBody);
        yield user.save();
        //token creation function
        (0, cookieGenerator_1.default)(user, res, "Register Succesfully");
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error
        });
    }
});
exports.handleSignup = handleSignup;
const handleRefreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cookies = req.cookies;
    if (!(cookies === null || cookies === void 0 ? void 0 : cookies.jwt))
        return res.sendStatus(401);
    const refreshToken = cookies.jwt;
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
    // const foundUser = await User.findOne({ refreshToken }).exec();
    // // Detected refresh token reuse!
    // if (!foundUser) {
    //     jwt.verify(
    //         refreshToken,
    //         process.env.REFRESH_TOKEN_SECRET,
    //         async (err, decoded) => {
    //             if (err) return res.sendStatus(403); //Forbidden
    //             console.log('attempted refresh token reuse!')
    //             const hackedUser = await User.findOne({ username: decoded.username }).exec();
    //             hackedUser.refreshToken = [];
    //             const result = await hackedUser.save();
    //             console.log(result);
    //         }
    //     )
    //     return res.sendStatus(403); //Forbidden
    // }
    // evaluate jwt:obj 
    jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_KEY, (err, decode) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            console.log('expired refresh token');
        }
        const user = yield User_1.default.findOne({ id: decode.id }).exec();
        (0, cookieGenerator_1.default)(user, res, "Re-login  Success");
    }));
});
exports.handleRefreshToken = handleRefreshToken;
