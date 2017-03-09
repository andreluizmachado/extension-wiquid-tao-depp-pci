/*
Copyright DEPP © 2017 - Ministère de l'éducation nationale 
*/
<<<<<<< HEAD:views/js/pcicreator/dev/abeille/runtime/abeille.amd.js

define(['qtiCustomInteractionContext', 
        'IMSGlobal/jquery_2_1_1',
        'abeille/runtime/js/renderer',
         'OAT/util/event'], function(qtiCustomInteractionContext, $,renderer, event){

    "use strict";         

    var abeille = {
=======

define(['qtiCustomInteractionContext', 'IMSGlobal/jquery_2_1_1', 'lentilles/runtime/js/renderer', 'OAT/util/event'], function(qtiCustomInteractionContext, $, renderer, event){

    "use strict"; 

    var lentilles = {
>>>>>>> localdev:views/js/pciCreator/dev/lentilles/runtime/lentilles.amd.js
        id : -1,
        getTypeIdentifier : function(){
            return 'abeille';
        },
        /**
         * Render the PCI : 
         * @param {String} id
         * @param {Node} dom
         * @param {Object} config - json
         */
        initialize : function initialize(id, dom, config, assetManager){

            //add method on(), off() and trigger() to the current object
            event.addEventMgr(this);

            var _this = this;
            this.id = id;
            this.dom = dom;
            this.config = config || {};

            renderer.render(this.id, this.dom, this.config, assetManager);

            //tell the rendering engine that I am ready
            qtiCustomInteractionContext.notifyReady(this);
       
        },
        /**
         * Programmatically set the response following the json schema described in
         * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343
         * 
         * @param {Object} interaction
         * @param {Object} response
         */
        setResponse : function(response){

            var $container = $(this.dom),value;
        },
        /**
         * Get the response in the json format described in
         * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343
         * 
         * @param {Object} interaction
         * @returns {Object}
         */
        getResponse : function(){

<<<<<<< HEAD:views/js/pcicreator/dev/abeille/runtime/abeille.amd.js
            var $container = $(this.dom), value = "pesticide clics : "+ $container.find(".pesticlick").text() + " - frelon clics : "+ $container.find(".frelonclick").text();
=======

            var $container = $(this.dom),
                value =  "worksheet : " + $container.find('.reptablor').text() + ' graphic : ' + $container.find('.repgraphor').text()+ " navigation : " + $container.find('.navicount').text();
>>>>>>> localdev:views/js/pciCreator/dev/lentilles/runtime/lentilles.amd.js

            return {base : {string : value}};
        },
        /**
         * Remove the current response set in the interaction
         * The state may not be restored at this point.
         * 
         * @param {Object} interaction
         */
        resetResponse : function(){

            var $container = $(this.dom);

            $container.find('input').prop('checked', false);
        },
        /**
         * Reverse operation performed by render()
         * After this function is executed, only the inital naked markup remains 
         * Event listeners are removed and the state and the response are reset
         * 
         * @param {Object} interaction
         */
        destroy : function(){

            var $container = $(this.dom);
            $container.off().empty();
        },
        /**
         * Restore the state of the interaction from the serializedState.
         * 
         * @param {Object} interaction
         * @param {Object} serializedState - json format
         */
        setSerializedState : function(state){

        },
        /**
         * Get the current state of the interaction as a string.
         * It enables saving the state for later usage.
         * 
         * @param {Object} interaction
         * @returns {Object} json format
         */
        getSerializedState : function(){

            return {};
        }
    };

    qtiCustomInteractionContext.register(abeille);
});