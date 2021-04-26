const express = require('express');
const Task = require('../models/task.js');
const auth = require('../middleware/auth.js')
const router = new express.Router();

//Operation on Tasks Collection.
//Write operation
router.post('/tasks', auth, async (req, res)=>{
    // const task = new Task(req.body);
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try{
        await task.save();
        res.status(201).send(task);
    }catch(e){
        res.status(400).send(e);
    }
})

//Read Operation
router.get('/tasks', auth, async (req, res)=>{
    
    //Pagenation:
    //GET /task?limit=10&skip=10

    const match = {};
    const sort = {};

    //GET /tasks?completed=true/false
    if(req.query.completed){
        match.completed = req.query.completed === 'true';
    }
    //Code for sorting
    //GET /tasks?sortBy=field:order
    
    if(req.query.sortBy){
        const parts = req.query.sortBy.split( ':');
        sort[parts[0]] = parts[1] === 'asc' ? 1 : -1;
    }

    try{
        // const tasks = await Task.find({owner: req.user._id});
        // res.send(tasks);
        //Either of the two will work
        //await req.user.populate('tasks').execPopulate();
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    }catch(e){
        res.status(500).send(e);
    }
})

//Read One Operation
router.get('/tasks/:id', auth, async (req, res)=>{
    const id = req.params.id;

    try{
        // const task = await Task.findById(id);
        const task = await Task.findOne({ _id:id, owner: req.user._id })
        if(!task){
            return res.status(404).send();
        }
        res.send(task);
    }catch(e){
        console.log(e);
        res.status(500).send(e);
    }
})

//Update Operation
router.patch('/tasks/:id', auth, async(req, res)=>{
    const id = req.params.id;

    const updates = Object.keys(req.body);
    const allowedUpdates = [ 'description', 'completed'];

    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
    if(!isValidOperation){
        return res.status(404).send({error: 'Invalid Updates, all the property does not exist.'});
    }

    try{
        // const task = await Task.findByIdAndUpdate(id, req.body, {new:true, runValidators: true})
        //const task = await Task.findById(id);
        const task = await Task.findOne({_id: id, owner: req.user._id})
        if(!task){
            return res.status(404).send();
        }
        updates.forEach((update)=> task[update] = req.body[update])
        await task.save();
        res.send(task);
    }catch(e){
        res.status(400).send(e);
    }
})

//Delete Operation
router.delete('/tasks/:id', auth, async(req, res)=>{
    const id = req.params.id;
    try{
        // const task = await Task.findByIdAndDelete(id)
        const task = await Task.findOneAndDelete({_id: id, owner: req.user._id})

        if(!task){
            return res.status(404).send();
        }
        res.send(task);
    }catch(e){
        res.status(500).send();
    }
})

module.exports = router;
