// +----------------------------------------------------------------------
// | MapABC JavaScript API
// +----------------------------------------------------------------------
// | Copyright (c) 2012 http://MapABC.com All rights reserved.
// +----------------------------------------------------------------------
// | Licensed AutoNavi MapABC
// +----------------------------------------------------------------------
// | Author: yhostc <yhostc@gmail.com>
// +----------------------------------------------------------------------
(function($){
	$.fn.autoPrompts = function(opts) {
		opts.onSelect  = opts.onSelect || function(){};
		$(this).attr("autocomplete","off");//禁止浏览器自动完成
		this.each(function(){
			var input = $(this),
			ui = $("<ul class=\"autoprompts\"></ul>");
			//构建展现容器及样式
			$(opts.appendTo || this).after(ui);
			if(input.length==0){return false;}
			var h = parseFloat(input.position().top) + parseFloat(input.css("border-bottom-width")) + parseFloat(input.css("border-top-width"));
			ui.css({
				"width":input.width()+ parseFloat(input.css("border-left-width")) +"px",
				"left":input.position().left+"px",
				"top":input.height()+ h + 2 +"px",
				//"border-color":input.css("border-bottom-color")
			});
			var isajax=0,last="";
			//表单监控，发送查询
			input.bind("keyup",function(e){
				if((e.keyCode>=48 && e.keyCode<=57) || (e.keyCode>=65 && e.keyCode<=90) || (e.keyCode>=97 && e.keyCode<=112) || [8,32].indexOf(e.keyCode)>-1){//仅处理有效字符建
					var val = $(this).val();
					if(isajax==0 && val && $.trim(val).length>=opts.minLength && last!=val){
						isajax = 1;last = val;
						$.ajax({type:"GET",dataType:"json",url:opts.source,data:{k:val},success:function(data){
							var a = [];
							ui.html("");
							for(var i=0;i<data.length;i++){
								var b = $("<li></li>");
								if(typeof(b)=="string"){//直接装在结果
									b.text(data[i]);
								}else if(typeof(b)=="object"){//封装多余结果
									b.text(data[i].name);
								}
								b.data(data[i]);
								ui.append(b);
							}
							ui.show().find("li").hover(function(){
								$(this).addClass("hover");
							},function(){
								$(this).removeClass("hover");
							}).click(function(){
								input.val($(this).text());
								opts.onSelect(ui.find("li[class=hover]").data(),input);
							});
							isajax = 0;//归置状态
						}});
					}else{
						ui.hide();
					}
				}
			});
			function direction(i){
				var a = ui.find("li[class=hover]");
				var b = ui.find("li");
				var c = b.index(a) + i;
				if(c>=0 && c<=b.length-1){
					b.removeClass("hover");
					b.eq(c).addClass("hover").focus();
					input.val(b.eq(c).text());
				}
			}
			//表单事件监控
			input.keydown(function(e){
				if(e.keyCode==38){//上移
					direction(-1);
				}else if(e.keyCode==40){//下移
					direction(+1);
				}else{
					if(e.keyCode==13){
						ui.hide();
						opts.onSelect(ui.find("li[class=hover]").data(),input);
					}
					e.stopPropagation();
				}
			}).blur(function(){
				setTimeout(function(){ui.hide();},200);
			});
		});
	};
})(jQuery);