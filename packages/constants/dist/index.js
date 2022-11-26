"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOT_NODE_MODULES = exports.ROOT = void 0;
const path_1 = __importDefault(require("path"));
exports.ROOT = path_1.default.resolve(__dirname, '..', '..', '..');
exports.ROOT_NODE_MODULES = path_1.default.resolve(exports.ROOT, 'node_modules');
