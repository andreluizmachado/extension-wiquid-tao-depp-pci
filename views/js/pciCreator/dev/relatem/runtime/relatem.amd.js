define(['qtiCustomInteractionContext', 
        'IMSGlobal/jquery_2_1_1',
        'relatem/runtime/js/renderer', 
        'OAT/util/event'], 
        function(qtiCustomInteractionContext, $,renderer, event){

    var relatem = {
        id : -1,
        getTypeIdentifier : function(){
            return 'relatem';// Récupère l'identifiant du TYPE d'ITEM
        },
        /**
         * Render the PCI : 
         * @param {String} id
         * @param {Node} dom
         * @param {Object} config - json
         */
        initialize : function(id, dom, config, assetManager){

            //add method on(), off() and trigger() to the current object
            event.addEventMgr(this);

            var _this = this;
            this.id = id;
            this.dom = dom; // Reçoit la valeur dom passer en initialisation
            this.config = config || {};

            renderer.render(this.id, this.dom, this.config, assetManager);

          

            //tell the rendering engine that I am ready
            qtiCustomInteractionContext.notifyReady(this);

            

            /*//listening to dynamic configuration change
            this.on('levelchange', function(level){
                _this.config.level = level;
                renderer.renderChoices(_this.id, _this.dom, _this.config);
            });*/
        },
        /**
         * Programmatically set the response following the json schema described in
         * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343
         * 
         * @param {Object} interaction
         * @param {Object} response
         */
        setResponse : function(response){// Fait passer la réponse à la fonction. La var response est définie dans question.js

            var $container = $(this.dom), value ;

           // $container.find('input[value="' + value + '"]').prop('checked', true); // trouve le input dont la valeur est value et le met sur true !
        },
        /**
         * Get the response in the json format described in
         * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343
         * 
         * @param {Object} interaction
         * @returns {Object}
         */
        getResponse : function(){

            var $container = $(this.dom),
                value = $("#ansrdm").text();
                value = value.slice(0,-1); // Enlève la dernière virgule.


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

    qtiCustomInteractionContext.register(relatem);
});