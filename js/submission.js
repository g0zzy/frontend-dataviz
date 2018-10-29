$(document).ready(function() {	
		var submissionsPromise = $.getJSON("./json/mockSubmission.json");
		var answersPromise = $.getJSON("./json/mockSubmissionAnswer.json");
		var questionsPromise = $.getJSON("./json/Question.json");
		var questions = [];
		var submissions = []; 
		// my date format - can format any date time using moment
		$.fn.dataTable.moment('DD/MM/YYYY HH:mm');
		// when all requests complete
		$.when(submissionsPromise, answersPromise, questionsPromise).then(function(submissionJson, answerJson, questionJson) {
			$.each( submissionJson[0], function( key, value ) {
				var submission = value; 
				var answers = [];
				$.each( answerJson[0], function( key, value ) {
					if(submission.SubmissionId === value.SubmissionId){	// for each submission loop through the answer json and find its answers
						var answerObj = {};
						answerObj.questionId = value.QuestionId;
						answerObj.answerText = value.Text;
						answers.push(answerObj);
					}
				});
				submission.Date = moment(value.Date).format('DD/MM/YYYY HH:mm');	// date format changed
				submission.answers = answers; 
				submissions.push(submission);
			});
			initialiseTable();
			initialiseMap();
			initialiseQuestionsArray(questionJson[0]);
		});
		
		$('#mapButton').on('click', displayMap);
		$('#listButton').on('click', displayList);
		
		$('.btn-primary').on('click', function() {	// keep button selected
			$(this).addClass('active').siblings().removeClass('active');	// deactivating the other buttons in the container
		});
		
		$(document).on('click', '.answerImg', function() {
			var $imgClone = $(this).clone();
			$imgClone.css({ 'width': $(this).width() * 2,
							'margin-left' : '20%' }).appendTo('.modal-body');	// larger image appended to dialogue body
			$imgClone.removeClass('answerImg');		// disable clicking on the larger img
			$imgClone.removeAttr('title');
			$('#largeImgModal').modal('show');
		});
			
		$('#largeImgModal').on('hidden.bs.modal', function() {	// erase all html in dialogue when closed
			$('.modal-body').html("");
		});
		
		function initialiseQuestionsArray(questionJson){
			$.each( questionJson, function( key, value ) {
				var questionObj = {};
				questionObj.questionId = value.QuestionId;
				questionObj.questionText = value.Text;
				questions.push(questionObj);	// questions = [{ questionId: 1, questionText: "blabla"}]
			});
		}
				
		function initialiseTable(){
			var submissionTable = $('#submissionTable').DataTable( {
				data: submissions,
				"columns": [
					{ className: "details-control",		// extra column for the plus sign
					  orderable: false,
					  data: null,
					  defaultContent: "",
					  render: function () {
                         return '<i class="fas fa-plus-circle" aria-hidden="true"></i>';
                      },
					  width:"20px"},
					{ data: "SubmissionId" },
					{ data: "Date"},
					{ data: "Address"}
				],
				"order": [[1, 'asc']]
			} );

			$('#submissionTable tbody').on('click', 'td.details-control', function() {
				var tr = $(this).closest('tr');
				var tdi = tr.find("i.fas");
				var row = submissionTable.row(tr);
		 
				if ( row.child.isShown() ) { // row already open - close it
					row.child.hide();
					tdi.first().removeClass('fa-minus-circle').addClass('fa-plus-circle');
					tr.removeClass('highlight');
				}
				else {	// open row
					row.child( format(row.data()) ).show();
					tdi.first().removeClass('fa-plus-circle').addClass('fa-minus-circle');
					tr.addClass('highlight');
				}
			} );	
		}
		
		function format (rowData) {
			var answers = rowData.answers; 
			// Sort array of answers according to their question id to display from 1 to array length
			answers.sort(function(a, b) {
				return a.questionId - b.questionId;
			});
			return createAnswersTable(answers);
		}
		
		function createAnswersTable(answers){
			var row = "<table class='table answerTable' style='width:100%'>";
			for(var i = 0; i < answers.length; i++){
				var answerText = answers[i].answerText; 
				if(answerText === "NULL")
					answerText = "<img class='answerImg' src='https://goo.gl/Kv2akJ' width='150' alt='placeholder' title='Click to see larger'>";
				
				var questionText = getQuestionText(answers[i].questionId);
				row += getRowData(answers[i].questionId, questionText, answerText);
			}
			row += "</table>";
			return row;
		}
		
			
		function getQuestionText(questionId){
			for(var i = 0; i < questions.length; i++){
				if( questions[i].questionId === questionId ) 
					return questions[i].questionText;
			}
		}	
		
		function getRowData(questionId, questionText, answerText){
			return	"<tr><td rowspan='2'> Q" + questionId + "</td>" + 
				"<td>" + questionText + "</td></tr>" +
				"<tr><td>" + answerText + "</td>" +
				"</tr>";
		}
		
		function initialiseMap() {
			var mapProperties = {
				center: new google.maps.LatLng(submissions[0].Latitude,submissions[0].Longitude),
				zoom: 6
			};
			var map = new google.maps.Map(document.getElementById("googleMap"), mapProperties);
			var infowindow = new google.maps.InfoWindow();
			
			var marker, i;
			for (i = 0; i < submissions.length; i++) { 
				marker = new google.maps.Marker({
							position: new google.maps.LatLng(submissions[i].Latitude, submissions[i].Longitude),
							map: map 
						});
				google.maps.event.addListener(marker, 'click', (function(marker, i) {
					return function() {
						var html = getInfoWindowText(submissions[i].SubmissionId, submissions[i].Date, submissions[i].Address);
						var table = format(submissions[i]);
						appendAnswerTable(table);
						infowindow.setContent(html);
						infowindow.open(map, marker, html);
					}
				})(marker, i));
			}
			$('#mapContainer').hide();
		}
		
		function getInfoWindowText(submissionId, date, address) {
			return "<h4> Submission " + submissionId + " </h4> submitted on <br/>" + date 
					+ "<br/> <h5>Address: </h5>" + address;
		}
		
		function appendAnswerTable(table){
			if($('#mapContainer').has('table'))		// if there is an answerTable already - delete
				$('#mapContainer table').remove();
			$('#mapContainer').append(table);
		}
		
		function displayMap(){
			$('#submissionContainer').fadeOut(150, function(){
				$('#mapContainer').fadeIn(150); 
			});
		}
		
		function displayList(){			
			$('#mapContainer').fadeOut(150, function(){
				$('#submissionContainer').fadeIn(150); 
			});
		}
						
});
