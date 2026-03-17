// import multer from 'multer';
// import path from "path"
// import { v2 as cloudinary } from 'cloudinary';
// import { ApiError } from '../utils/ApiError.js';
 


// import pkg from 'multer-storage-cloudinary';
// const { CloudinaryStorage } = pkg;


// if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
//     console.error("CRITICAL ERROR: Cloudinary credentials missing from .env file!");
 
// }


// cloudinary.config({
//     cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret : process.env.CLOUDINARY_API_SECRET
// });


// const cloudinaryStorage = new CloudinaryStorage({
//     cloudinary : cloudinary,
//     params : {
//         folder : 'agnisense_uploads',
//         public_id : (req,file) => {
//             const fileNameWithoutExt = file.originalname.split('.').slice(0,-1).join('_');
//             return `${fileNameWithoutExt}_${Date.now()}`;
//         },
//         quality : 80,
//     },
// });


// const fileFilter = (req, file, cb) => { 
//     if (!file.mimetype.startsWith('image/')) {
//         return cb( 
//             new ApiError(400,'Only image files are allowed!'),
//             false 
//         );
//     }
//     return cb(null, true); 
// };

// const localDiskStorage = multer.diskStorage({
//     destination:function(req,file,cb) {
//         cb(null,"./public/temp")
//     },
//     filename:function(req,file,cb){
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });

// const uploadLocal = multer({
//     storage:localDiskStorage,
//     limits:{fileSize:10*1024*1024},
//     fileFilter
// })



// const upload = multer({
//     storage : cloudinaryStorage,
//     limits : { fileSize: 10*1024*1024},
//     fileFilter : fileFilter, 
// });


//  const uploadSingleImage = (fieldName) => upload.single(fieldName);

// export { 
//     upload,
//     uploadSingleImage,
//     uploadLocal
// };



import multer from 'multer';
import path from "path";
import { ApiError } from '../utils/ApiError.js';

// 1. Update File Filter for BOTH PDF and Images
const multiFormatFileFilter = (req, file, cb) => { 
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true); 
    }
    return cb(new ApiError(400, 'Only PDF documents and Images (JPG/PNG) are allowed!'), false);
};

// 2. Local Storage (ML Server par bhejne ke liye temporary save)
const localDiskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/temp") // Make sure ye folder exist karta ho aapke project mein
    },
    filename: function(req, file, cb){
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Extension dynamically nikal lega (.pdf, .jpg, etc.)
        cb(null, 'legal-doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 3. Export Middleware
const uploadDocument = multer({
    storage: localDiskStorage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit taaki heavy PDFs/Images handle ho sakein
    fileFilter: multiFormatFileFilter
});

export { uploadDocument };