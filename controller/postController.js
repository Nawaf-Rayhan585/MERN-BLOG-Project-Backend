const path = require('path')
const fs = require('fs')
const {v4: uuid} = require('uuid')
const HttpError = require('../models/errorModel')
const userModel = require('../models/userModel')
const postModel = require('../models/postModel')

const createPost = async (req, res, next) => {
    try {
        let {title, category, description} = req.body;
        console.log(req.files)
        if(!title || !category || !description || !req.files) {
            return next(new HttpError("Fill in all fields and choose thumbnail.", 422))
        }

        const {thumbnail} = req.files;

        // check the file size
        if(thumbnail.size > 2000000) {
            return next(new HttpError("Thumbnail size too large. File should be less than 2MB."))
        }
        
        let fileName = thumbnail.name;
        let splittedFilename = fileName.split('.');
        let newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1];

        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFilename), async (err) => {
            if (err) {
                return next(new HttpError(err));
            } else {
                const newPost = await postModel.create({
                    title,
                    category,
                    description,
                    thumbnail: newFilename,
                    creator: req.user.id
                });
            
                if (!newPost) {
                    return next(new HttpError("Post couldn't be created.", 422));
                }
            
                // Find user and increment post count by 1
                const currentUser = await userModel.findById(req.user.id);
                const userPostCount = currentUser.posts + 1;
            
                await userModel.findByIdAndUpdate(req.user.id, { posts: userPostCount });

                res.status(201).json(newPost)
            }
        });
    } catch (error) {
        return next(new HttpError(error))
    }
};


const getPosts = async (req, res, next) => {
    try {
        const posts = await postModel.find().sort({updateAt: -1});
        res.status(200).json(posts);
    
       } catch (error) {
            return next(new HttpError(error))
       } 
};


const getPost = async (req, res, next) => {
   try {

    const postId = req.params.id;
    const post = await postModel.findById(postId);
    if (!post) {
    return next(new HttpError("Post not found.", 404));
    }
    res.status(200).json(post);

   } catch (error) {
        return next(new HttpError(error))
   } 
};


const getCatPosts = async (req, res, next) => {
    try {
        const { category } = req.params;
        const catPosts = await postModel.find({ category }).sort({ createdAt: -1 });

        res.status(200).json(catPosts)
    } catch (error) {
        return next(new HttpError(error))
    }
};



const getUserPosts = async (req, res, next) => {
    try {
        const {id} = req.params;
        const posts = await postModel.find({creator: id}).sort({createdAt: -1})
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
};


const editPost = async (req, res, next) => {
    try {
      let fileName;
      let newFilename;
      let updatedPost;
      const postId = req.params.id;

      let {title , category , description} = req.body;

      if(!title || !category || description.length < 12) {
        return next(new HttpError("Fill In All Fields", 422))
      }

    const oldPost = await postModel.findById(postId)
      if(req.user.id == oldPost.creator) {
        if(!req.files) {
            updatedPost = await postModel.findByIdAndUpdate(postId, {title, category, description} , {new: true})
          } else {
            const oldPost = await postModel.findById(postId)
            
            fs.unlink(path.join(__dirname, '..', 'uploads' , oldPost.thumbnail), async (err) => {
                if(err) {
                    return next(new HttpError(err))
                }
            })
    
            
            const {thumbnail} = req.files;
    
            if(thumbnail.size > 2000000) {
                return next(new HttpError("thumbnail to big , should be more less then 2mb"))
            }
    
            fileName = thumbnail.name;
            let splittedFilename = fileName.split('.')
            newFilename = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length - 1]
            thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
                if (err) {
                    return next(new HttpError(err))
                }
            })
    
            updatedPost = await postModel.findByIdAndUpdate(postId, {title, category, description, thumbnail: newFilename}, {new:true})
    
          }
    
      }


      if(!updatedPost) {
        return next(new HttpError("couldn't update post", 400))
      }

      res.status(200).json(updatedPost)


    } catch (error) {
        return next(new HttpError(error))
    }
};


const deletePost = async (req, res, next) => {
    const postId = req.params.id;

    if (!postId) {
        return next(new HttpError('Post unavailable.', 400));
    }

    const post = await postModel.findById(postId);
    const fileName = post?.thumbnail;

    // Delete thumbnail from uploads folder
    if (req.user.id == post?.creator) {
        fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async (err) => {
            if (err) {
                console.log(err)
              return next(new HttpError(err))
            } else {
              await postModel.findByIdAndDelete(postId);
              // Find user and reduce post count by 1
              const currentUser = await userModel.findById(req.user.id);
              const userPostCount = currentUser?.posts - 1;
      
              await userModel.findByIdAndUpdate(req.user.id, { posts: userPostCount });
            }
          });
    } else {
        return next(new HttpError("Post couldn't be deleted"))
    }

    res.json(`Post ${postId} deleted successfully.`);
};
module.exports = {
    createPost,
    getPosts, 
    getPost,
    getCatPosts,  
    getUserPosts, 
    editPost, 
    deletePost 

};