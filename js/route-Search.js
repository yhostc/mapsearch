// JavaScript Document
searchCate.route = function(){
	var a = [];
	a.push("<div class=\"route-widget\">");
	a.push("<div class=\"widget-place\">");
	a.push("<div class=\"widget movable\"><span class=\"widget-header\">A</span><input type=\"text\" name=\"route\" value=\"\"/><a class=\"widget-remove\" href=\"javascript:void(0)\"></a></div>");
	a.push("<div class=\"widget movable\"><span class=\"widget-header\">B</span><input type=\"text\" name=\"route\" value=\"\"/><a class=\"widget-remove\" href=\"javascript:void(0)\"></a></div>");
	a.push("</div>");
	a.push("<a class=\"widget-return kd-button\"><img src=\"images/blank.gif\"></a>");
	a.push("<div id=\"add_dest\"><a href=\"javascript:void(0)\">添加更多目的地</a></div>");
	a.push("<div class=\"dir-title\">途径的地点:<div class=\"dir-list\">");
	a.push("</div></div>");
	a.push("<div class=\"route-button\"><input type=\"button\" value=\"查询线路\" style=\"margin-left:20px;\"></div>");
	a.push("</div>");
	a.push("<div class=\"route-result\"></div>");
	$(".ct-route").html(a.join(""));
	
	this.init();
};
searchCate.route.prototype = {
	init:function(){
		//加载拖拽插件
		$.getScript("js/jquery.easywidgets.min.js",function(){
			$.fn.EasyWidgets({
				callbacks:{
					onChangePositions:function(){
						$(".route-widget").children(".widget-place").find('.widget-header').each(function(i){
							$(this).text(String.fromCharCode(65+i));
						});
					}
				}
			});
		});
		$(".widget-place>div>a").hide();
		$("#add_dest").click(function(e) {
			self.addLine();
		});
		this.nextFocus();
		$(".route-widget").children(".widget-return").click(function(e) {
			var exchange = '';
            $(".widget-place").find("input[name=route]").each(function(i) {
                if(i == 0){
					exchange = $(this).val();
					$(this).val($(".widget-place").find(":input[name=route]:eq(1)").val());
				}
				if(i == 1){
					$(this).val(exchange);
				}
            });
        });
		//自动完成
		var ele = this;
		$("input[name=route]").autoPrompts({//起点
			source: "c.php/Server/autoPrompts",
			minLength: 2,
		});
		
		var self = this;
		$(".route-button").click(function(){
			self.j = 0;
			self.route = [];
			self.keyword();
		});
	},
	nextFocus:function(){
		$(".widget-place").find("input[name=route]").keydown(function(e) {
			if(e.keyCode == 13){
				var is = 0;
				$(".widget-place").find("input[name=route]").each(function(i){
					if($(this).val() == ''){
						is = 1;
						$(this).focus();
						return false;
					}
				});
				if(is == 0){
					$(".route-button").click();
				}
			}
		});
	},
	addLine:function(){
		var temp = "<div class=\"widget movable\"><span class=\"widget-header\"></span><input type=\"text\" name=\"route\" value=\"\"/><a class=\"widget-remove\" href=\"javascript:void(0)\"></a></div>";
		$(".route-widget").children(".widget-place").append(temp);
		$(".route-widget").children(".widget-place").find('.widget-header').each(function(i){
			$(this).text(String.fromCharCode(65+i));
		});
		$.fn.EasyWidgets();
		$("input[name=route]").autoPrompts({//起点
			source: "c.php/Server/autoPrompts",
			minLength: 2,
		});
		this.nextFocus();
		if($(".route-widget").children(".widget-place").find('.widget-header').length>=5){
			$("#add_dest").hide();
		}
		
		if($(".route-widget").children(".widget-place").find('.widget-header').length>2){
			$(".kd-button").hide();
			$(".widget-place>div>a").show();
		}
		this.removeLine();
	},
	outLine:function(){
		var temp = "<div class=\"widget movable\"><span class=\"widget-header\"></span><input type=\"text\" name=\"route\" value=\"\"/><a class=\"widget-remove\" href=\"javascript:void(0)\"></a></div>";
		$(".route-widget").children(".widget-place").append(temp);
		$(".route-widget").children(".widget-place").find('.widget-header').each(function(i){
			$(this).text(String.fromCharCode(65+i));
		});
		//$.fn.EasyWidgets();
		$("input[name=route]").autoPrompts({//起点
			source: "c.php/Server/autoPrompts",
			minLength: 2,
		});
		this.nextFocus();
		if($(".route-widget").children(".widget-place").find('.widget-header').length>=5){
			$("#add_dest").hide();
		}
		
		if($(".route-widget").children(".widget-place").find('.widget-header').length>2){
			$(".kd-button").hide();
			$(".widget-place>div>a").show();
		}
		this.removeLine();
	},
	removeLine:function(){
		$(".widget-place>div>a").unbind("click");
		$(".widget-place>div>a").click(function(i){
			if($(".widget-place").find("div").length>2){
				//判断是否存在空白项，如有，则先从空白项开始删起
				var s = true;
				var obj = $(".widget");
				for(var i=0;i<obj.length;i++){
					var v = $.trim(obj.eq(i).find("input").val());
					if(v=='' && s){
						obj.eq(i).remove();
						s = false;
						break;
					}
				}
				if(s){
					$(this).parent().remove();
				}
			}
			$(".route-widget").children(".widget-place").find('.widget-header').each(function(i){
				$(this).text(String.fromCharCode(65+i));
			});
			var len = $(".route-widget").children(".widget-place").find('.widget-header').length;
			if(len<=2){
				$(".kd-button").show();
				$(".widget-place>div>a").hide();
			}
			if(len < 5){
				$("#add_dest").show();
			}
		});
	},
	//循环进行关键字查询处理
	j:0,//关键字查询指针
	route:[],//查询条件数组
	keyword:function(){
		searchType = "route";
		var k = $("input[name=route]"),self=this;
		console.log(k.length);
		if(this.j<k.length){//查询下一个关键字
			if(this.route[this.j]){//若此项已存在，则跳过
				this.j++;
				this.keyword();
			}else{
				this.poiSearch(k.eq(this.j).val());
			}
		}else{//已完成关键字匹配操作，进入路线查询
			$.getScript("js/DragRoute.js",function(e){
				route = new DragRoute(map,self.route);
				route.search();
			});
		}
	},
	//POI查询，进行定位
	poiSearch:function(k){
		var temp=[],self=this;
		$.ajax({type:"POST",dataType:"json",data:{k:k},url:"c.php/Server/autoPrompts",
			success:function(data){
				if(data.length==0){//错误处理
					temp.push("<p><span class=\"widget-header\">");
					temp.push(String.fromCharCode(65+self.j)+"</span> 未查到有效信息，请换个表达方式试试！");
					temp.push("</p>");
					$(".route-result").html(temp.join(""));
					return void(0);
				}
				//记录此位置，并进行下一个关键字查询
				self.route[self.j] = new AMap.LngLat(data[0].x,data[0].y);
				self.route[self.j].name = data[0].name;
				self.j++;
				self.keyword();
			}
		});
	}
};
//searchCate.route = routeSearch;