function getBestProduct(scores, classes){
    console.log("scores \n");
    console.log(scores);
    
    console.log("classes \n");
    console.log(classes);
    //return the best class
    var bestClass = null;
    var bestScore = -1; 
    var bestIndex = null; 

    var secondClass = null;
    var secondScore = -1;
    var secondIndex = null;

    var thirdClass = null; 
    var thirdScore = -1; 
    var thirdIndex = null; 

    var length = scores.length;
    for(i = 0; i < length; i++){
        const curScore = scores[i]; 
        const curClass = classes[i]
        //check if any of the best 3 is null
        if(!bestClass){
            bestClass = curClass;
            bestScore = curScore;
            bestIndex = i; 
            continue;
        }
        if(!secondClass){
            secondClass = curClass;
            secondScore = curScore;
            secondIndex = i; 
            continue; 
        }
        if(!thirdClass){
            thirdClass = curClass;
            thirdScore = curScore; 
            thirdIndex = i; 
            continue;
        }
        if(curScore > bestScore){
            const newSecondClass = bestClass;
            const newSecondScore = bestScore;
            const newSecondIndex = bestIndex; 
            const newThirdClass = secondClass;
            const newThirdScore = secondScore;
            const newThirdIndex = secondIndex; 
            bestClass = curClass;
            bestScore = curScore;
            bestIndex = i; 
            secondClass = newSecondClass;
            secondScore = newSecondScore;
            secondIndex = newSecondIndex; 
            thirdClass = newThirdClass;
            thirdScore = newThirdScore;
            thirdIndex = newThirdIndex; 
            continue;
        }
        if(curScore > secondScore){
            const newThirdClass = secondClass;
            const newThirdScore = secondScore;
            const newThirdIndex = secondIndex; 
            secondScore = curScore;
            secondClass = curClass;
            secondIndex = i; 
            thirdScore=newThirdScore;
            thirdClass=newThirdClass;
            thirdIndex = newThirdIndex; 
            continue;
        }
        if(curScore > thirdScore){
            thirdClass = curClass;
            thirdScore = curScore;
            thirdIndex = i; 
            continue;
        }
    }
    console.log(`bestClass: ${bestClass}\n`)
    console.log(`bestScore: ${bestScore}\n`)
    console.log(`bestIndex: ${bestIndex}\n`)
    console.log(`secondClass: ${secondClass}\n`)
    console.log(`secondScore: ${secondScore}\n`)
    console.log(`secondIndex: ${secondIndex}\n`)
    console.log(`thirdClass: ${thirdClass}\n`)
    console.log(`thirdScore: ${thirdScore}\n`)
    console.log(`thirdIndex: ${thirdIndex}\n`)
    return bestClass;
}

module.exports = getBestProduct; 
 
